# winter-camp
code for ml-winter-camp.

####Run Sketch RNN
~~~~
python sketch_rnn_train.py --log_root=checkpoint_path --data_dir=dataset_path --hparams="data_set=[class1.npz,class2.npz,class3.npz],dec_model=hyper,dec_rnn_size=2048,enc_model=layer_norm,enc_rnn_size=512,save_every=5000,grad_clip=1.0,use_recurrent_dropout=0"
~~~~
